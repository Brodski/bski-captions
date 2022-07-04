//blog_index blog_details, blog_create_get, blog_create

const Blog = require('../models/blog');
const Transcript = require('../models/transcript');


const blog_index = (req, res) => {
  Transcript.find().sort( {createdAt: -1}).then( result =>  {
    res.render('blogs/blogs', {blogs: result} )
  })
}

const blog_details = (req, res) => {
  console.log('req.params', req.params)
  const id = req.params.id
  Blog.findById(id).then( result => {
    console.log("result", result)
    res.render('blogs/details', {blog: result})
  })
  .catch(err => {
    res.status(404).redirect('/404.html')
  })
}

const create_test = (req, res) => {
  res.render('blogs/create')
}


const blog_create_post =  (req, res) => {
  console.log(req.body)
  const blog = new Blog(req.body)
  blog.save().then((result) => {
    console.log('saved!')
    res.redirect('/blogs')
  })
}

const blog_get_all = (req, res) => {
  Blog.find().then( result => {
    res.send(result)
  })
}

module.exports = {
  blog_index,
  blog_details,
  blog_create_get,
  blog_create_post,
  blog_get_all,
}