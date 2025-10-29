import request from 'supertest';
import app from '../src/index';

describe('User and Todo API', () => {
  let user;

  beforeEach(async () => {
    user = { name: 'John Doe', username: 'johndoe' };
    await request(app).post('/users').send(user);
  });

  it('should create a new user', async () => {
    const response = await request(app).post('/users').send({
      name: 'Jane Doe',
      username: 'janedoe',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Jane Doe');
    expect(response.body.username).toBe('janedoe');
  });

  it('should not create a user with an existing username', async () => {
    const response = await request(app).post('/users').send(user);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'This username already exists!' });
  });

  it('should get todos for a user', async () => {
    const response = await request(app)
      .get('/todos')
      .set('username', user.username);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should create a new todo for a user', async () => {
    const todo = { title: 'Buy milk', deadline: new Date().toISOString() };
    const response = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send(todo);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Buy milk');
    expect(response.body.done).toBe(false);
  });

  it('should update a todo', async () => {
    const todo = { title: 'Buy milk', deadline: new Date().toISOString() };
    const { body: createdTodo } = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send(todo);

    const updatedTodo = { title: 'Buy almond milk', deadline: new Date().toISOString() };
    const response = await request(app)
      .put(`/todos/${createdTodo.id}`)
      .set('username', user.username)
      .send(updatedTodo);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Buy almond milk');
  });

  it('should mark a todo as done', async () => {
    const todo = { title: 'Buy milk', deadline: new Date().toISOString() };
    const { body: createdTodo } = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send(todo);

    const response = await request(app)
      .patch(`/todos/${createdTodo.id}/done`)
      .set('username', user.username);

    expect(response.status).toBe(200);
    expect(response.body.done).toBe(true);
  });

  it('should delete a todo', async () => {
    const todo = { title: 'Buy milk', deadline: new Date().toISOString() };
    const { body: createdTodo } = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send(todo);

    const response = await request(app)
      .delete(`/todos/${createdTodo.id}`)
      .set('username', user.username);

    expect(response.status).toBe(204);
  });
});