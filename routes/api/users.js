const express = require('express');
const router = express.Router();
const gravatar = require('gravatar')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('config')
const { check, validationResult } = require('express-validator');
const User = require('../../models/User')

// Signup For User
router.post(
  '/',
  [                     // Validation using Express-validator
    check('name', 'Name is Required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async(req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {name, email, password} = req.body;

    try {
        // See if user exists
        let user = await User.findOne({email})

        if(user) {
            return res.status(400).json({errors: [{msg: 'User Already Exists'}] });
        }

        // Get User gravatar
        const avatar = gravatar.url(email, {
            s: '200', // size
            r: 'pg',  //rating
            d: 'mm'   // default image when no avatar found
        })

        user = new User({
            name, 
            email,
            avatar,
            password,
        })

        // Encrypt Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Return jsonwebtoken
        const payload = {
          user: {
            id: user.id,
          }
        }

        jwt.sign(
          payload, 
          config.get('jwtSecret'),
          { expiresIn: 360000 },
          (err, token) => {
            if(err) throw err;
            return res.json({ token })
          }
          )

        // res.send('User Registered Successfully');
    }

    catch(error) {
        console.error(error.message)
        res.status(500).send('Server Error');
    }

  }
);

module.exports = router;
