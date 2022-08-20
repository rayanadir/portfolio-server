const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Token = require('../models/token.model');
const { resetPassword } = require('../utils/emailTemplate');
const { sendEmail } = require('../utils/sendEmail');
const nodemailer = require('nodemailer')
const mongoose = require('mongoose');

// register
module.exports.signUp = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;
    // validation
    const usernameRegex = /^[0-9a-zA-Z\-éëàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇÆæœ]{3,}$/;
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const usernameTest = usernameRegex.test(username);
    const emailTest = emailRegex.test(email);

    if (!email || !username || !password || !confirmPassword)
      return res
        .status(400)
        .json({
          message: "One or several fields are missing.",
          code_msg: "field_miss"
        });
    if (!usernameTest) {
      return res
        .status(400)
        .json({
          message: "Enter a valid username, at least 3 characters",
          code_msg: "invalid_username"
        })
    }
    if (!emailTest) {
      return res
        .status(400)
        .json({
          message: "Enter a valid email address",
          code_msg: "invalid_email"
        })
    }

    if (password.length < 6)
      return res.status(400).json({
        message: "Password length must be at least 6 characters",
        code_msg: "password_length",
      });

    if (password !== confirmPassword)
      return res.status(400).json({
        message: "The passwords are not identical",
        code_msg: "different_passwords"
      });

    const existingUser = await User.findOne({ email: email });
    if (existingUser)
      return res.status(400).json({
        message: "An account already uses this email",
        code_msg: "account_exists",
      });
    
    const existingUsername = await User.findOne({username});
    if(existingUsername){
      return res.status(400).json({
        message:"This username is already taken",
        code_msg:"existing_username",
      })
    }

    // hash the password

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // save a new user account to the db
    const userId= new mongoose.Types.ObjectId().toHexString()

    const newUser = new User({
      email,
      username,
      passwordHash,
      isAdmin: false,
      first_login: new Date(),
      last_login: new Date(),
      userId,
    });

    const savedUser = await newUser.save();

    // sign the token
    const token = jwt.sign(
      {
        userId: savedUser.userId,
      },
      process.env.TOKEN_SECRET,
      {expiresIn:'30d'}
    );
    //console.log(token);

    // send the token in a HTTP-only cookie
    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .send({ message: "User successfully created !", code_msg: "user_created", token, userId });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
  }
}

// login
module.exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const emailTest = emailRegex.test(email);
    // validate
    if (!email && !password)
      return res
        .status(400)
        .json({ message: "Please enter all fields.", code_msg: "all_fields_miss" });
    if (!email)
      return res
        .status(400)
        .json({ message: "Please enter email.", code_msg: "email_miss" });
    if (!emailTest) {
      return res
        .status(400)
        .json({
          message: "Enter a valid email address",
          code_msg: "invalid_email"
        })
    }
    if (!password)
      return res
        .status(400)
        .json({ message: "Please enter password.", code_msg: "password_miss" });


    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res.status(401).json({ message: "Unknown email", code_msg: "unknown_email" });

    const passwordCorrect = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );
    if (!passwordCorrect)
      return res.status(401).json({ message: "Incorrect password", code_msg: "incorrect_password" });

    await existingUser.updateOne({ last_login: new Date() })
    // sign the token

    const token = jwt.sign(
      {
        userId: existingUser.userId,
      },
      process.env.TOKEN_SECRET,
      {expiresIn:'30d'},
    );

    // send the token in a HTTP-only cookie
    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .json({ message: "User successfully logged in !", code_msg: "user_logged", token, userId: existingUser.userId });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
  }
}

// logout
module.exports.logout = (req, res) => {
  return res
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json({
      message:"Logout successfully",
      code_msg:"logout_success"
    })
    .send();
}

// loggedIn
module.exports.loggedIn = (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(400).json({message:"no token"});

    jwt.verify(token, process.env.TOKEN_SECRET);

    return res.status(201).json({message:"token exists"});
  } catch (err) {
    res.status(500).json({message:"error"});
  }
}

// resetPassword
module.exports.resetPassword = async (req, res) => {
  try {
    const { token,newPassword, confirmNewPassword } = req.body;
    if (!newPassword) {
      return res.status(400)
        .json({
          message: "Enter password",
          code_msg: "password_miss",
          status: 'fail',
        })
    }
    if (!confirmNewPassword) {
      if (!newPassword) {
        return res.status(400)
          .json({
            message: "Enter confirm password",
            code_msg: "password_confirm_miss",
            status: 'fail',
          })
      }
    }
    if (newPassword.length < 6) {
      return res.status(400)
        .json({
          message: "Password length must be at least 6 characters",
          code_msg: "password_length",
          status: 'fail',
        })
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "The passwords are not identical",
        code_msg: "different_passwords",
        status: 'fail'
      });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await User.findOneAndUpdate({ userId: req.user }, { passwordHash });

    return res.status(200).json({
      status: 'success',
      message: "Password reset successfully",
      code_msg: "password_reset",
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: "Server error",
      code_msg: "server_error",
    });
  }
}

// forgotPassword
module.exports.forgotPassword = async (req, res) => {

  try {
    const { email } = req.body;
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const emailTest = emailRegex.test(email);

    if (!email) {
      return res.status(400).
        json({
          message: "Enter email",
          code_msg: "email_miss",
          status: 'fail',
        })
    }
    if (!emailTest) {
      return res.status(400)
        .json({
          message: "Invalid email",
          code_msg: "invalid_email",
          status: 'fail',
        })
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: "Unknown email",
        code_msg: "unknown_email",
      })
    }

    const token = jwt.sign(
      {
        user: user.userId
      },
      process.env.JWT_RESET_KEY,
      {
        expiresIn: "7d",
      }
    )

    Token.findOneAndUpdate({ userId: user.userId, tokenType: "resetPassword" }, { token: token }, {
      new: true, upsert: true
    }, async (err, doc) => {
      if (doc) {
        console.log(token);
        user.resetPasswordToken = token;
        user.expirePasswordTokenReset = Date.now() + 3 * 24 * 60 * 60 * 1000 // 3 days before token expiration
        user.userId = doc.userId;
        await user.save()
        const url = `${process.env.BASE_URL}reset/${token}`;
        await sendEmail(user.email, user.username, "Réinitialisation du mot de passe/Password reset", url);
        res.status(200).json({
          status: 'success',
          message: "Email for reset password has been sent",
          code_msg: "email_sent"
        })
      } else if (err) {
        return res.status(500).json({
          status: 'fail',
          message: "Server error",
          code_msg: "server_error",
        })
      }
    });

  } catch (err) {
    return res.status(500)
      .json({
        status: 'fail',
        message: "Server error",
        code_msg: "server_error",
      })
  }

}

// changePassword
module.exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword, userId } = req.body;
  console.log(currentPassword, newPassword, confirmNewPassword);
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({
      message: "Please enter all fields.", code_msg: "all_fields_miss", status: 'fail'
    })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "Password length must be at least 6 characters",
      code_msg: "password_length",
      status: 'fail',
    })
  }
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      message: "The passwords are not identical",
      code_msg: "different_passwords",
      status: 'fail',
    })
  }
  const user = await User.findOne({userId});
  if (user) {
    bcrypt.compare(currentPassword, user.passwordHash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({
          status: 'fail',
          message: "Server error",
          code_msg: "server_error",
        })
      } else if (isMatch) {
        bcrypt.hash(newPassword, 10, async (err, hash) => {
          if (err) {
            return res.status(500).json({
              status: 'fail',
              message: "Error, cannot encrypt password",
              code_msg: "encrypy_password_error",
            })
          }
          user.passwordHash = hash;
          user.save().then(updatedUser => {
            return res.status(200).json({
              status: 'success',
              message: "Password has been changed successfully",
              code_msg: "password_changed",
            })
          })
        })
      } else {
        return res.status(401).json({
          status: 'fail',
          message: "Old password incorrect",
          code_msg: "current_password_incorrect",
        })
      }
    })
  }
}

// checkToken
module.exports.checkToken = async (req, res) => {
  try {
    const {token} = req.body;
    const token_database = await Token.findOne({token});
    if(!token_database){
      console.log("aucun token reconnu");
      res.status(400).json({
        status: 'invalid',
        message: "Invalid token",
        code_msg: "invalid_token",
      });
    }else{
      console.log("token reconnu");
      res.status(200).json({
        status: 'initial',
        message: "Valid token",
        code_msg: "valid_token",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: "Server error",
      code_msg: "server_error",
    });
  }
} 