var express = require('express');
var app = express();
var async = require('async')
var fs = require('fs');
var redis = require('redis')
client = redis.createClient();

app.use('/', express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.cookieSession({secret: 'Bruce'}));

function User(firstname, lastname, email, password) {
  this.firstname = firstname;
  this.lastname = lastname;
  this.email = email;
  this.password = password;
}

function Post(postText, photo, email, postId, parentId) {
  this.postText = postText;
  this.photo = photo;
  this.email = email;
  this.postId = postId;
  this.parentId = parentId;
}

var createUser = function (req, res) {
  var user = new User(req.body.firstname, req.body.lastname, req.body.email, req.body.password)
  req.session.userId = user.email
  user.saveUser()
  res.send(true);
}

var listUsers = function (req, res) {
  var users = [];
  client.hgetall("user", function (err, obj) {
    if(obj===null) {
      res.send([])
    } else {
    for (var i in obj) {
      users.push(JSON.parse(obj[i]))
    }
    res.send(users)
  }
  })
}

var createPost = function (req, res) {
  var temp_path = req.files.photo.path;
  fs.readFile(temp_path, function (err, data) {
    var newPath = __dirname + "/public/uploads/" + req.files.photo.name;
    var post = new Post(req.body.postText, newPath);
    post.email = req.session.userId;
    fs.writeFile(newPath, data, function (err) {
    });
    post.savePost()
    res.end()
  });
}


var listPosts = function(req, res) {
  client.hgetall("post", function (err, obj) {
    if (obj===null) res.send([]);
    else {
    iterate(obj, function (posts) {
      res.send(posts)
    })
  }
  })
}


var iterate = function (obj, callback) {
  var posts = [];
  for (var i in obj) {
    createPost(obj[i], function (err, post) {
      console.log(post)
      if (err) console.log("There was an error!");
      else posts.push(post)
    })
  }
  callback(null, posts)
}

var createPost = function (obj, callback) {
  getPostInfo(obj, function (err, post) {
    if (err) return callback(err);
    addUserInfo(post, function (err, post) {
      if (err) return callback(err);
      addImage(post, function (err, post) {
        if (err) return callback(err);
        callback(err, post);
      }) 
    })
  })
}

var getPostInfo = function (obj, callback) {
  var post = new Post()
  post.email = JSON.parse(obj).email
  post.postText = JSON.parse(obj).postText
  post.photo = JSON.parse(obj).photo
  callback(null, post)
}

var addUserInfo = function (post, callback) {
  client.hget("user", post.email, function(err, obj) {
    post.firstname = JSON.parse(obj).firstname
    post.lastname = JSON.parse(obj).lastname
    callback(null, post)
  })
}

var addImage = function (post, callback) {
  fs.readFile(post.photo, 'binary', function (err, file) {
    post.photo = file
   // res.end(file, 'binary');
    callback(null, post)
  })
}

User.prototype.saveUser = function () {
  client.hset("user", this.email, JSON.stringify(this))
}

User.prototype.listUser = function () {
  client.hget("user", this.email, function(err, obj) {
  })
}

Post.prototype.savePost = function () {
  client.hset("post", this.postText, JSON.stringify(this))
}


app.post('/posts', createPost)
app.get('/posts', listPosts)
app.post('/users', createUser);
app.get('/users', listUsers);


app.listen(3030)