import { Link } from "react-router-dom";

function Landing() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Bar */}
            <nav className="border-b border-gray-200">
                {/* Container */}
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                    MeetCut
                    </Link>

                    {/* Navigation Buttons */}
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-700 hover:text-gray-900 px-4 py-2 font-medium transition-colors">
                        Log in
                        </Link>
                        <Link to="/signup" className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors">
                        Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-6 py-32 text-center">
                <h1 className="text-6xl font-bold mb-6 leading-tight">
                    Turn Long Meetings into
                    <br />
                    <span className="text-blue-600">Smart Insights</span>
                </h1>
                <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                    MeetCut uses AI to summarize your meetings, extract key action items, and provide you with concise insights, so you can focus on what matters most.
                </p>

                {/* CTA Buttons */}
                <div className="flex items-center justify-center space-x-4">
                    <Link to="/signup" className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-blue-700 transition-colors">
                        Get Started
                    </Link>

                    <button className="bg-white text-gray-700 px-8 py-4 rounded-md font-semibold text-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Landing
