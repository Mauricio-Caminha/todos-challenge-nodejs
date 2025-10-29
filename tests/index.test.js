import request from 'supertest';
import app from '../index';

describe('User and Todo Management', () => {
  let user;

  beforeEach(async () => {
    // Create a user for testing
    const response = await request(app)
      .post('/users')
      .send({ name: 'John Doe', username: 'johndoe' });
    user = response.body;
  });

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Jane Doe', username: 'janedoe' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Jane Doe');
    expect(response.body.username).toBe('janedoe');
  });

  it('should not create a user with an existing username', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'John Doe', username: 'johndoe' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'This username already exists!' });
  });

  it('should create a new todo for a user', async () => {
    const response = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send({ title: 'New Todo', deadline: new Date().toISOString() });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('New Todo');
  });

  it('should get all todos for a user', async () => {
    await request(app)
      .post('/todos')
      .set('username', user.username)
      .send({ title: 'First Todo', deadline: new Date().toISOString() });

    const response = await request(app)
      .get('/todos')
      .set('username', user.username);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('should update a todo', async () => {
    const todoResponse = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send({ title: 'Todo to Update', deadline: new Date().toISOString() });

    const todoId = todoResponse.body.id;

    const response = await request(app)
      .put(`/todos/${todoId}`)
      .set('username', user.username)
      .send({ title: 'Updated Todo', deadline: new Date().toISOString() });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Todo');
  });

  it('should mark a todo as done', async () => {
    const todoResponse = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send({ title: 'Todo to Mark Done', deadline: new Date().toISOString() });

    const todoId = todoResponse.body.id;

    const response = await request(app)
      .patch(`/todos/${todoId}/done`)
      .set('username', user.username);

    expect(response.status).toBe(200);
    expect(response.body.done).toBe(true);
  });

  it('should delete a todo', async () => {
    const todoResponse = await request(app)
      .post('/todos')
      .set('username', user.username)
      .send({ title: 'Todo to Delete', deadline: new Date().toISOString() });

    const todoId = todoResponse.body.id;

    const response = await request(app)
      .delete(`/todos/${todoId}`)
      .set('username', user.username);

    expect(response.status).toBe(204);
  });

  it('should return 404 when trying to get todos for a non-existing user', async () => {
    const response = await request(app)
      .get('/todos')
      .set('username', 'nonexistinguser');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found!' });
  });

  it('should return 404 when trying to update a non-existing todo', async () => {
    const response = await request(app)
      .put('/todos/nonexistingid')
      .set('username', user.username)
      .send({ title: 'Updated Todo', deadline: new Date().toISOString() });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Todo not found!' });
  });

  it('should return 404 when trying to mark a non-existing todo as done', async () => {
    const response = await request(app)
      .patch('/todos/nonexistingid/done')
      .set('username', user.username);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Todo not found!' });
  });

  it('should return 404 when trying to delete a non-existing todo', async () => {
    const response = await request(app)
      .delete('/todos/nonexistingid')
      .set('username', user.username);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Todo not found!' });
  });
});