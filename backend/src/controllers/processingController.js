import Meeting from '../models/Meeting.js';
import Transcript from '../models/Transcript.js';
import * as whisperService from '../services/whisperService.js';
import * as groqService from '../services/groqService.js';
import * as pdfService from '../services/pdfService.js';
import * as emailService from '../services/emailService.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProcessingController {
    /**
     * Download audio file from URL
     * (Since whisperService expects a buffer, not a URL)
     */
    async downloadAudio(audioURL) {
        try {
            console.log('Downloading audio from:', audioURL);

            const response = await axios({
                method: 'GET',
                url: audioURL,
                responseType: 'arraybuffer'
            });

            const audioBuffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'audio/mpeg';

            console.log('Audio downloaded:', audioBuffer.length, 'bytes');
            console.log('Content-Type:', contentType);

            return {
                buffer: audioBuffer,
                mimeType: contentType,
                fileName: `recording_${Date.now()}.mp4`
            };

        } catch (error) {
            console.error('Audio download failed:', error.message);
            throw new Error(`Failed to download audio: ${error.message}`);
        }
    }

    /**
     * Main processing pipeline
     * Orchestrates: Download → Whisper → Groq → Save → PDF → Email
     */
    async processCompletedMeeting(meetingId) {
        const startTime = Date.now();
        let meeting;

        try {
            console.log('\n===== STARTING PROCESSING PIPELINE =====');
            console.log('Meeting ID:', meetingId);

            // ===== STEP 0: Get Meeting =====
            meeting = await Meeting.findById(meetingId);

            if (!meeting) {
                throw new Error(`Meeting not found: ${meetingId}`);
            }

            if (!meeting.recordingURL) {
                throw new Error('No recording URL available');
            }

            console.log('Meeting found:', meeting.title);
            console.log('Recording URL:', meeting.recordingURL);

            // Update status
            meeting.processingStatus = 'transcribing';
            await meeting.save();

            // ===== STEP 1: DOWNLOAD AUDIO =====
            console.log('\n===== STEP 1/6: DOWNLOADING AUDIO =====');

            const audioData = await this.downloadAudio(meeting.recordingURL);

            // ===== STEP 2: TRANSCRIBE WITH WHISPER =====
            console.log('\n===== STEP 2/6: WHISPER TRANSCRIPTION =====');

            const transcriptResult = await whisperService.transcribeAudio(
                audioData.buffer,
                audioData.mimeType,
                audioData.fileName
            );

            console.log('Transcription completed');
            console.log('Transcript length:', transcriptResult.text?.length || 0, 'characters');

            const fullTranscript = transcriptResult.text || '';
            const wordCount = fullTranscript.split(/\s+/).filter(w => w.length > 0).length;

            // Parse segments into speakers (simple speaker diarization)
            const speakers = this.createSpeakersFromSegments(transcriptResult.segments || []);

            console.log('Word count:', wordCount);
            console.log('Speakers detected:', speakers.length);

            // Update status
            meeting.processingStatus = 'analyzing';
            await meeting.save();

            // ===== STEP 3: ANALYZE WITH GROQ =====
            console.log('\n===== STEP 3/6: GROQ AI ANALYSIS =====');

            const analysis = await groqService.generateSummary({
                transcript: fullTranscript,
                title: meeting.title,
                date: meeting.scheduledTime,
                participants: meeting.attendeeEmails?.join(", ")
            });

            console.log('AI Analysis completed');
            console.log('Summary generated:', !!analysis.summary);
            console.log('Key points:', analysis.keyPoints?.length || 0);

            // Extract structured data from analysis
            const structuredData = this.extractStructuredData(analysis, fullTranscript);

            console.log('Structured data extracted:');
            console.log('   - Action items:', structuredData.actionItems.length);
            console.log('   - FAQs:', structuredData.faqs.length);
            console.log('   - Key decisions:', structuredData.keyDecisions.length);

            // ===== STEP 4: SAVE TO DATABASE =====
            console.log('\n ===== STEP 4/6: SAVING TO DATABASE =====');

            const transcript = await Transcript.create({
                userId: meeting.userId,
                meetingId: meeting._id,
                fullTranscript: fullTranscript,
                speakers: speakers,
                summary: analysis.summary || '',
                chapters: structuredData.chapters || [],
                faqs: structuredData.faqs || [],
                actionItems: structuredData.actionItems || [],
                keyDecisions: structuredData.keyDecisions || [],
                wordCount: wordCount,
                processingTime: (Date.now() - startTime) / 1000
            });

            console.log('Transcript saved');
            console.log('Transcript ID:', transcript._id);

            // ===== STEP 5: GENERATE PDF =====
            console.log('\n===== STEP 5/6: GENERATING PDF =====');

            // Prepare PDF options matching your pdfService signature
            const pdfOptions = {
                meetingTitle: meeting.title || 'Meeting Transcript',
                dateTime: meeting.scheduledTime ? meeting.scheduledTime.toString() : new Date().toString(),
                segments: transcriptResult.segments, // Use segments from whisper
                fullText: fullTranscript,
                language: transcriptResult.language || 'en',
                durationSeconds: transcriptResult.durationSeconds || 0,
                participants: meeting.attendeeEmails || []
            };

            const pdfBuffer = await pdfService.generateTranscriptPDF(pdfOptions);

            // Save PDF to file system
            const uploadsDir = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const pdfFileName = `transcript_${meeting._id}.pdf`;
            const pdfPath = path.join(uploadsDir, pdfFileName);
            fs.writeFileSync(pdfPath, pdfBuffer);

            // Update transcript with PDF URL
            transcript.pdfURL = `/uploads/pdfs/${pdfFileName}`;
            await transcript.save();

            console.log('PDF generated:', pdfBuffer.length, 'bytes');
            console.log('PDF saved at:', pdfPath);

            // ===== STEP 6: SEND EMAIL =====
            if (meeting.attendeeEmails && meeting.attendeeEmails.length > 0) {
                console.log('\n===== STEP 6/6: SENDING EMAILS =====');
                console.log('Recipients:', meeting.attendeeEmails);

                try {
                    const emailResult = await emailService.sendMeetingEmail({
                        transcriptId: transcript._id.toString(),
                        recipients: meeting.attendeeEmails,
                        includeTranscript: true,
                        senderName: 'MeetCut System'
                    });

                    console.log('Email sent successfully');
                } catch (emailError) {
                    console.warn(' Email sending failed:', emailError.message);
                    // Don't fail the whole pipeline if email fails
                }
            } else {
                console.log('\nSTEP 6/6: SKIPPING EMAIL (no attendees)');
            }

            // ===== FINALIZE =====
            meeting.processingStatus = 'completed';
            await meeting.save();

            const totalTime = (Date.now() - startTime) / 1000;

            console.log('\n🎉 ===== PROCESSING COMPLETED SUCCESSFULLY =====');
            console.log(' Total time:', totalTime.toFixed(2), 'seconds');
            console.log('Status: completed');
            console.log('Results:');
            console.log('   - Transcript ID:', transcript._id);
            console.log('   - PDF URL:', transcript.pdfURL);
            console.log('   - Word count:', wordCount);
            console.log('==================================================\n');

            return {
                success: true,
                transcript,
                processingTime: totalTime,
                stats: {
                    wordCount: wordCount,
                    speakers: speakers.length,
                    actionItems: structuredData.actionItems.length,
                    faqs: structuredData.faqs.length
                }
            };

        } catch (error) {
            console.error('\ ===== PROCESSING FAILED =====');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.error('====================================\n');

            // Update meeting status
            if (meeting) {
                meeting.processingStatus = 'failed';
                meeting.errorMessage = error.message;
                await meeting.save();
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create speaker segments from Whisper segments
     * Simple diarization based on pauses
     */
    createSpeakersFromSegments(segments) {
        if (!segments || segments.length === 0) {
            return [{
                name: 'Speaker 1',
                segments: []
            }];
        }

        const speakers = [];
        let currentSpeaker = {
            name: 'Speaker 1',
            segments: []
        };
        let speakerCount = 1;

        segments.forEach((seg, index) => {
            const pause = index > 0 ? (seg.start || 0) - (segments[index - 1].end || 0) : 0;

            // If pause > 2 seconds, assume new speaker
            if (pause > 2 && currentSpeaker.segments.length > 0) {
                speakers.push(currentSpeaker);
                speakerCount++;
                currentSpeaker = {
                    name: `Speaker ${speakerCount}`,
                    segments: []
                };
            }

            currentSpeaker.segments.push({
                start: seg.start || 0,
                end: seg.end || 0,
                text: seg.text || ''
            });
        });

        if (currentSpeaker.segments.length > 0) {
            speakers.push(currentSpeaker);
        }

        return speakers;
    }

    /**
     * Extract structured data from Groq analysis
     */
    extractStructuredData(analysis, fullTranscript) {
        // Extract action items from summary
        const actionItems = [];
        const actionRegex = /(?:action item|task|todo|need to|should|must):\s*([^.]+)/gi;
        let match;

        while ((match = actionRegex.exec(analysis.summary || '')) !== null) {
            actionItems.push({
                task: match[1].trim(),
                assignee: 'Unassigned',
                priority: 'medium'
            });
        }

        // Extract FAQs from key points
        const faqs = (analysis.keyPoints || []).map((point, index) => ({
            question: `What was discussed about ${point.split(' ')[0]}?`,
            answer: point
        }));

        // Extract decisions
        const keyDecisions = [];
        const decisionRegex = /(?:decided|agreed|concluded):\s*([^.]+)/gi;

        while ((match = decisionRegex.exec(analysis.summary || '')) !== null) {
            keyDecisions.push({
                decision: match[1].trim(),
                context: 'From meeting discussion',
                timestamp: 0
            });
        }

        return {
            actionItems,
            faqs: faqs.slice(0, 5), // Limit to 5 FAQs
            keyDecisions,
            chapters: [{
                title: 'Meeting Discussion',
                timestamp: 0,
                description: analysis.summary?.substring(0, 200) || 'Main discussion'
            }]
        };
    }

    /**
     * Format timestamp to MM:SS
     */
    formatTimestamp(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Reprocess failed meeting
     */
    async reprocessMeeting(meetingId) {
        console.log('Reprocessing meeting:', meetingId);

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            throw new Error('Meeting not found');
        }

        meeting.processingStatus = 'not_started';
        meeting.errorMessage = null;
        await meeting.save();

        return this.processCompletedMeeting(meetingId);
    }
}

export default new ProcessingController();