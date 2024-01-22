const express = require('express')
const router = express.Router()
const {check, validationResult} = require('express-validator')
const auth = require('../../middleware/auth')

const Post = require('../../models/Post')
const User = require('../../models/User')
const Profile = require('../../models/Profile')

// Create POST route
router.post('/', [auth, [
    check('text', 'Text is Required')
    .not()
    .isEmpty()
    ]
],
 async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
        
        const post = await newPost.save();
        res.json(post);
    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
    
});


// Get All post route using GET
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})

// Get single post by Its ID route
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({message: 'Post not found:'});
        }
         
        res.json(post);
    } 
    catch (error) {
        console.error(error.message);

        if(error.kind == 'ObjectId') {
            return res.status(400).json({message: 'Post not Found'});
        }
        res.status(500).send('Server Error'); 
    }
})

// Delete a post By ID route using Delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({message: 'Post not Found'});
        } 

        //Check User 
        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({message: 'User Not Authorized'});
        }

        await post.deleteOne();
        res.json({message: 'Post Deleted Successfully'});
    } 
    catch (error) {
        console.error(error.message);
        if(error.kind == 'ObjectId') {
            return res.status(400).json({message: 'Post not Found'});
        }
        res.status(500).send('Server Error'); 
    }
})

// Route for Likes count 
router.put('/like/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // If specific User already Likes that post
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
          return res.status(400).json({message: 'Post Already Liked:'})
        }

        post.likes.unshift({user: req.user.id});

        await post.save();
        res.json(post.likes);

    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})

// Route for UnLikes count 
router.put('/unlike/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // If specific User already Likes that post
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
          return res.status(400).json({message: 'Post has not yet been Liked:'})
        }

        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post.likes);

    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// Create POST route for comments creation by ID
router.post('/comment/:id', [auth, [
    check('text', 'Text is Required')
    .not()
    .isEmpty()
    ]
],
 async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComment);
        
        await post.save();
        res.json(post.comments);
    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
    
});

// Delete route for comment removal for post
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //Pull out that comment to be deleted
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        
        // Make sure comment exist
        if(!comment) {
            return res.status(404).json({message: 'Comment Not Found'});
        }

        // Make sure User Exist
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({message: 'User Not Authorized:'})
        }

        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);

        await post.save();
        res.json(post.comments);

    } 
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');    
    }
})

module.exports = router;