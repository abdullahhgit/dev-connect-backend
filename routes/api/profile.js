const express = require('express')
const request = require('request')
const config = require('config')
const router = express.Router()
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const {check, validationResult} = require('express-validator');

// Get the current User Profile
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate(
            'user',
            ['name', 'avatar']
        );

        if(!profile) {
            return res.status(400).json({msg: 'There is nor Profile for this user'});
        }

        res.json(profile);
    }

    catch(error){
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// POST api/profile create profile Route
router.post('/', [auth, [
    check('status', 'Status is required')
    .not()
    .isEmpty(),
    check('skills', 'Skills is Required')
    .not()
    .isEmpty()
]], 
 async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    const profileFields = {};

    profileFields.user = req.user.id;
    if(company) {
        profileFields.company = company;
    }
    if(website) {
        profileFields.website = website;
    }
    if(location) {
        profileFields.location = location;
    }
    if(bio) {
        profileFields.bio = bio;
    }
    if(status) {
        profileFields.status = status;
    }
    if(githubusername) {
        profileFields.githubusername = githubusername;
    }
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    
    profileFields.social = {}
    if(youtube) {
        profileFields.social.youtube = youtube;
    }
    if(twitter) {
        profileFields.social.twitter = twitter;
    }
    if(facebook) {
        profileFields.social.facebook = facebook;
    }
    if(linkedin) {
        profileFields.social.linkedin = linkedin;
    }
    if(instagram) {
        profileFields.social.instagram = instagram;
    }

    try {
        let profile = await Profile.findOne({user: req.user.id});

        if(profile) {
            // Update Profile
            profile = await Profile.findOneAndUpdate(
                {user: req.user.id}, 
                {$set: profileFields},
                {new: true}
            );

            return res.json(profile);
        }

        // Create Profile
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);
    }
    catch(error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// Get all Profiles
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}) 


// Get Profile By User ID
router.get('/user/:user_id', async (req, res) => {
    try {
        const profiles = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar']);

        if(!profiles) {
            return res.status(400).json({msg: 'Profile not Found'});
        }
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        if(error.kind == 'ObjectId') {
            return res.status(400).json({message: 'Profile not Found'});
        }
        res.status(500).send('Server Error');
    }
});

// Delete all Profiles
router.delete('/', auth, async (req, res) => {
    try {

        // Remove Profile
        await Profile.findOneAndDelete({user: req.user.id});
        // Remove User
        await User.findOneAndDelete({_id: req.user.id});

        res.json({msg: 'User Deleted Successfully'});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})

// Update Profile Experience
router.put(
    '/experience',
    [
        auth,
        [
            check('title', 'Title is Rquired')
            .not()
            .isEmpty(),

            check('company', 'Company name is Rquired')
            .not()
            .isEmpty(),

            check('from', 'From Date is Rquired')
            .not()
            .isEmpty(),
        ]
    ],
    async(req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {
            title,
            company,
            location, 
            from,
            to,
            current,
            description
        } = req.body;

        const newExperience = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({user: req.user.id});
            profile.experience.unshift(newExperience);
           
            await profile.save();

            res.json(profile);
        } 
        catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
)

// Delete Profile Experience
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        
        // Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        console.log('Profile before removal:', profile);

        if (removeIndex === -1) {
            return res.status(404).json({ msg: 'Experience not found' });
        }

        profile.experience.splice(removeIndex, 1);

        console.log('Profile after removal:', profile);

        await profile.save();

        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// Update Profile Education
router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is Rquired')
            .not()
            .isEmpty(),

            check('degree', 'Degree is Rquired')
            .not()
            .isEmpty(),

            check('fieldofstudy', 'Field of Study is Rquired')
            .not()
            .isEmpty(),

            check('from', 'From Date is Rquired')
            .not()
            .isEmpty(),
        ]
    ],
    async(req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {
            school,
            degree,
            fieldofstudy, 
            from,
            to,
            current,
            description
        } = req.body;

        const newEducation = {
            school,
            degree,
            fieldofstudy, 
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({user: req.user.id});
            profile.education.unshift(newEducation);
           
            await profile.save();

            res.json(profile);
        } 
        catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
)

// Delete Profile Education
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        
        // Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        console.log('Profile before removal:', profile);

        if (removeIndex === -1) {
            return res.status(404).json({ msg: 'Education not found' });
        }

        profile.education.splice(removeIndex, 1);

        console.log('Profile after removal:', profile);

        await profile.save();

        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// GET request for api/profile/github/:username
// Get user repos from Github
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            uri : `https://api.github.com/users/${
                req.params.username
                }/repos?per_page=5&sort=created:asc&client_id=${config.get(
                    'githubClientId'
                )}&client_secret=${config.get('githubSecret')}`,
                method: 'GET',
                headers: {
                    'user-agent': 'node.js'
                }
        };
        // Request is designed to be the simplest way possible to make http calls. It supports HTTPS and follows redirects by default.
        request(options, (error, response, body) => {
            if(error) {
                console.error(error);
            }

            if(response.statusCode !== 200) {
                res.status(404).json({msg: 'NO Github Profile Found'});
            }

            res.json(JSON.parse(body));
        })
    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})


module.exports = router;