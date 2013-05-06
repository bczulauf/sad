$(document).ready(function () {
  
  $.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
      if (o[this.name] !== undefined) {
        if (o[this.name].push) {
          o[this.name] = [o[this.name]];
        }
        o[this.name].push(this.value || '');
      } else {
        o[this.name] = this.value || '';
      }
    });
    return o;
  }
  
  $.fn.randomId = function () {
    ranNum = Math.floor(Math.random() * 10000)
    this.postId = ranNum;
  }
  
  $('#post-input').on('focus', function(){
    alert('heelo')
  })
  
  var User = Backbone.Model.extend({
    urlRoot: '/users'
  })
  
  var UserCollection = Backbone.Collection.extend({
    model: User,
    url: '/users'
  })
  
  var Post = Backbone.Model.extend({
    urlRoot: '/posts'
  })
  
  var PostCollection = Backbone.Collection.extend({
    model: Post,
    url: '/posts'
  })
  
  var PostList = Backbone.View.extend({
    el: '.page',
    render: function () {
      var that = this;
      var postCollection = new PostCollection();
      postCollection.fetch({
        success: function () {
          var template = _.template($('#post-list-template').html(), {postCollection: postCollection.models})
          that.$el.html(template)
        }
      })
    }
  }) 
  
  var UserList = Backbone.View.extend({
    el: '.page',
    render: function () {
      var that = this;
      var userCollection = new UserCollection();
      userCollection.fetch({
        success: function () {
          var template = _.template($('#user-list-template').html(), {userCollection: userCollection.models})
          that.$el.html(template);
        },
        error: function (error) {
          console.log(error)
        }
      })
    }
  });
  
  var NewUser = Backbone.View.extend({
    el: '.page',
    render: function () {
      var that = this;
      var template = _.template($('#new-user-template').html(), {})
      that.$el.html(template);
    },
    events: {
      'submit .new-user-form': 'saveUser'
    },
    saveUser: function (event) {
      var userDetails = $(event.currentTarget).serializeObject();
      var user = new User();
      user.save(userDetails, {
        success: function (user) {
          router.navigate('/users', {trigger: true})
        }
      })
      return false;
    }
  });
  
  var Router = Backbone.Router.extend({
    routes: {
      '': 'home',
	    'users': 'userList',
	    'new': 'newUser',
	    '/:signedIn': 'home'
    }
  });
  
  var userList = new UserList();
  var newUser = new NewUser();
  var postList = new PostList();
  var router = new Router();
  
  router.on('route:home', function () {
    postList.render();
  })
  
  router.on('route:userList', function () {
    userList.render();
  })
  
  router.on('route:newUser', function () {
    newUser.render();
  })
  
  
  Backbone.history.start();
})