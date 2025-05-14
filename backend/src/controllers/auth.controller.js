import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  const { fullName, email, password } = req.body;

  // Validate the input

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password should be at least 6 characters" });
    }

    // check if the email is correct

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    // Check the email is present or not

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; // generate a random number between 1 and 100

    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`; // generate a random avatar

    // Create a new user
    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created: ${newUser.fullName}`);
    } catch (error) {
      console.error("Error upserting Stream user:", error);
    }

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === "production", // set to true if using https
      sameSite: "strict", // prevent CSRF attacks
    });

    res.status(201).json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    // Validate the input
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === "production", // set to true if using https
      sameSite: "strict", // prevent CSRF attacks
    });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(200).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export function logout(req, res) {
  res.status(200).json({
    success: "true",
    message: "Logout successfully",
  });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, learningLanguage, location } =
      req.body;
    // Validate the input
    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: "Please fill all the fields",
        missingFeilds: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body, // update the user with the new data
        isOnboarded: true, // set the isOnboarded field to true
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User 4 not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated: ${updatedUser.fullName}`);
    } catch (streamError) {
        console.error("Error upserting Stream user:", streamError.message);
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error in onboard controller", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
