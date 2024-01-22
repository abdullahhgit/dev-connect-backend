const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const { check, validationResult } = require('express-validator');

// Verify token through protected middleware request using req.header. Middlware import above from middlware folder.
router.get('/', auth , async (req, res) => {
    // res.send('Auth Route')
     try {
        const user = await User.findById(req.user.id).select('-password'); // It shows user info except passowrd due to security reasons
        res.json(user);
     }
      catch (error) {
       console.error(error.message);
       res.status(500).send('Server Error');  
     }
});

    // For login request
router.post(
    '/',
    [                     // Validation using Express-validator
      check('email', 'Please enter a valid email').isEmail(),
      check('password', 'Password is required').exists()
    ],
    async(req, res) => {
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const {email, password} = req.body;
  
      try {
          // See if user exists
          let user = await User.findOne({email})
  
          if(!user) {
              return res.status(400).json({errors: [{msg: 'Invalid Credentials'}] });
          }

          // VERIFY EMAIL NAD PASSWORD
          const isMatch = await bcrypt.compare(password, user.password);

          if(!isMatch) {
            return res.status(400).json({message: 'Invalid Password'});
          }
          
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