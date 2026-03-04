const signup = async (req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success:false,
        errors: errors.array()
      });
    }

    const { fullName, email, password } = req.body;

    const userExist = await User.findOne({ email });

    if(userExist){
      return res.status(400).json({
        success:false,
        message:"Email already registered"
      });
    }

    const user = await User.create({
      fullName,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success:true,
      message:"User registered successfully",
      token,
        user:{
          id:user._id,
          fullName:user.fullName,
          email:user.email
        },
    });

  } catch(error){
    console.error("Signup error:",error);

    res.status(500).json({
      success:false,
      message:"Server error during signup",
      error: error.message
    });
  }
}



const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password'); // include password for comparison but hidden by default

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
            error: error.message
        });
    }
}

export { signup, login };




