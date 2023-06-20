const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const session = require('express-session');

app.use(bodyParser.json());
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
  }),
);

const secretKey = 'secretKey';
function verifyToken(req, res, next) {
  let token = req.session.token;

  if (!token) {
    return res.sendStatus(403);
  }

  jwt.verify(token, secretKey, (err) => {
    if (err) {
      return res.status(403).json({ valid: false });
    }

    next();
  });
}

let tasks = [
  { id: 1, title: 'Task 1', description: 'Description for Task 1' },
  { id: 2, title: 'Task 2', description: 'Description for Task 2' },
  { id: 3, title: 'Task 3', description: 'Description for Task 3' },
];

app.get('/tasks', verifyToken, (req, res) => {
  res.status(200).json(tasks);
});

app.post('/tasks', verifyToken, (req, res) => {
  let title = req.body.title;
  let description = req.body.description;
  let id = tasks.map((x) => x.id).sort((a, b) => b - a)[0] + 1;

  if (title) {
    let newTask = { id: id, title, description };
    tasks.push(newTask);
    res.status(201).json(newTask);
  } else {
    res.status(406).json({
      error: {
        code: 406,
        details: 'Tasks need a title',
      },
    });
  }
});

app.get('/tasks/:id', verifyToken, (req, res) => {
  let taskId = parseInt(req.params.id);
  let task = tasks.find((task) => task.id === taskId);
  if (task) {
    res.json(task);
  } else {
    res.sendStatus(404);
  }
});

app.put('/tasks/:id', verifyToken, (req, res) => {
  let taskId = parseInt(req.params.id);
  let title = req.body.title;
  let description = req.body.description;

  let taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) {
    res.sendStatus(404);
  } else if (!title) {
    res.status(406).json({
      error: {
        code: 406,
        details: 'Tasks need a title',
      },
    });
  } else {
    tasks[taskIndex] = { id: taskId, title, description };
    res.json(tasks[taskIndex]);
  }
});

app.delete('/tasks/:id', verifyToken, (req, res) => {
  let taskId = parseInt(req.params.id);
  let taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex !== -1) {
    let deletedTask = tasks.splice(taskIndex, 1)[0];
    res.json(deletedTask);
  } else {
    res.sendStatus(404);
  }
});

app.post('/login', (req, res) => {
  let password = req.body.password;
  let email = req.body.email;

  let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // eslint-disable-line

  if (email.match(mailformat) && password === 'm295') {
    let token = jwt.sign({ email }, secretKey);

    req.session.token = token;

    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

app.get('/verify', (req, res) => {
  let token = req.session.token;

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, secretKey, (err) => {
    if (err) {
      return res.sendStatus(401);
    }

    res.json({ valid: true });
  });
});

app.delete('/logout', verifyToken, (req, res) => {
  req.session.destroy();

  res.sendStatus(204);
});

app.use('*', (req, res) => {
  res.sendStatus(404);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
