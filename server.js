var express = require('express');
var app = express();
var fs = require('fs');
var redis = require('redis').createClient();
var nohm = require('nohm').Nohm;

redis.on("connect", function() {
  nohm.setClient(redis);
})

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

var User = nohm.model('User', {
  properties: {
    firstname: {
      type: 'string',
    },
    lastname: {
      type: 'string',
    },
    email: {
      type: 'string',
      index: true,
      unique: true
    },
    password: {
      type: 'string',
    }
  }
});

var Post = nohm.model('Post', {
  properties: {
    postText: {
      type: 'string'
    },
    userId: {
      type: 'string'
    }
  }
})

//get posts from database
var listPosts = function (req, res) {
    Post.find(function (err, ids) {
    var posts = [];
    var len = ids.length;
    var count = 0;
    console.log(ids, 'ids');
    if(ids.length === 0) {
      res.send([]);

    } else {
      ids.forEach(function (id) {
        var post = new Post();
        post.load(id, function (err, props) {
          posts.push({id: this.id, postText: props.postText, userId: props.userId});
          var queryId = post.p('userId');
          userQuery(queryId);
          if (++count === len) {
            res.send(posts);
          }
        });
      });
    }
  });
}

//get users from database
var listUsers = function (req, res) {
    User.find(function (err, ids) {
    var users = [];
    var len = ids.length;
    var count = 0;
    console.log(ids, 'ids');
    if(ids.length === 0) {
      res.send([]);

    } else {
      ids.forEach(function (id) {
        var user = new User();
        user.load(id, function (err, props) {
          users.push({id: this.id, firstname: props.firstname, lastname: props.lastname, email: props.email});
          if (++count === len) {
            res.send(users);
          }
        });
      });
    }
  });
}

var userQuery = function (queryId) {
  User.find({
    email: "'" + queryId +"'"
  },function(err, ids){
    console.log(err)
  })
}



//add user to database
var createUser = function (req, res) {
  var user = new User();
  user.p(req.body);
  req.session.userId = user.p('email')
  user.save(function (err) {
    res.send(user.allProperties(true));
  });
  console.log(req.session.userId)
}

//add post to database
var createPost = function (req, res) {
  var post = new Post();
  var userId = req.session.userId;
  post.p('userId', "'" + userId + "'");
  post.p(req.body);
  post.save(function (err) {
    res.send(post.allProperties(true));
  });
}

var session = function (req, res) {
  console.log(req.session.userId)
}

app.post('/posts', createPost)
app.get('/posts', listPosts)
app.get('/foo', session)
app.get('/users', listUsers);
app.post('/users', createUser);

app.listen(3000)