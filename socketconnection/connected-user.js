const users = [];
const usersForNotification = [];

// Join user to chat
function userJoin(id, userId, username) {
  const user = { id, userId, username };
  console.log(
    "--------------------User----------------Join-------------",
    user
  );

  const index = usersForNotification.findIndex(
    (user) => user.userId === userId
  );
  if (index === -1) {
    usersForNotification.push(user);
  }
  const index1 = users.findIndex((user) => user.userId === userId);
  if (index1 === -1) {
    users.push(user);
  }
  users.push(user);

  console.log("users", users);
  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}
// get User By UserName
function getUserByUserName(username) {
  //   console.log("getUserByUserName", users);
  let data;
  data = users.find((user) => user.username === username);
  if (!data) {
    data = usersForNotification.find((user) => user.username === username);
  }
  return data;
}
// User leaves chat
function userLeave(id, userId) {
  if (id) {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
      return users.splice(index, 1)[0];
    }
  }
  if (userId) {
    const index1 = usersForNotification.findIndex(
      (user) => user.userId === userId
    );
    if (index1 !== -1) {
      return usersForNotification.splice(index1, 1)[0];
    }
  }
}
const connectedUsers = {
  userJoin,
  getCurrentUser,
  getUserByUserName,
  userLeave,
};
export default connectedUsers;
