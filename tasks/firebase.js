const admin = require('firebase-admin');
const data = require('../data.json')

admin.initializeApp({
  credential: admin.credential.cert("../../servicekey.json"),
  databaseURL: "https://zacharyrs-me.firebaseio.com"
});

var db = admin.database();
var posts = db.ref('blog');
var pinned = db.ref('pinned');
var users = db.ref('users');

gulp.task('deploy:data', function () {
  users.set({});
  posts.set({});
  pinned.set({});
  for(var i in data) {
    console.log('User: ' + i);
    var user = users.push();
    var userId = user.key;
    var currentUser = {};
    var pinnedPosts = {};
    var currentPosts = data[i].posts;
    for(var p in currentPosts) {
      currentPost = currentPosts[p];
      console.log('Post: ' + currentPost.title);
      var post = posts.push();
      var postId = post.key;
      item = {
        content: {
          body: currentPost.body,
          title: currentPost.title,
          time: currentPost.time,
          show: currentPost.show,
          order: currentPost.time * -1,
          id: postId,
          userId: userId
        }
      }
      if(currentPost.pinned) {
        pinnedPosts[postId] = item;
      } else {
        post.set(item);
        currentUser[postId] = item;
      }
    }
    user.set({
      name: i,
      posts: currentUser,
      pinned: pinnedPosts
    });
    pinned.update(pinnedPosts);
  };
});