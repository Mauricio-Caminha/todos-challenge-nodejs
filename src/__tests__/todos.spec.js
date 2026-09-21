const request = require('supertest');
const { validate } = require('uuid');

const app = require('../');

describe('Todos', () => {
  it("should be able to list all user's todo", async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user1'
      });

    const todoDate = new Date();

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', userResponse.body.username);

    const response = await request(app)
      .get('/todos')
      .set('username', userResponse.body.username);

    expect(response.body).toEqual(
      expect.arrayContaining([
        todoResponse.body
      ]),
    )
  });

  it('should be able to create a new todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user2'
      });

    const todoDate = new Date();

    const response = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', userResponse.body.username)
      .expect(201);

    expect(response.body).toMatchObject({
      title: 'test todo',
      deadline: todoDate.toISOString(),
      done: false
    });
    expect(validate(response.body.id)).toBe(true);
    expect(response.body.created_at).toBeTruthy();
  });

  it('should be able to update a todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user7'
      });

    const todoDate = new Date();

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', userResponse.body.username);

    const response = await request(app)
      .put(`/todos/${todoResponse.body.id}`)
      .send({
        title: 'update title',
        deadline: todoDate
      })
      .set('username', userResponse.body.username);

    expect(response.body).toMatchObject({
      title: 'update title',
      deadline: todoDate.toISOString(),
      done: false
    });

    const getAllTodosResponse = await request(app)
      .get((`/todos/`))
      .set('username', userResponse.body.username);
    
    expect(
      getAllTodosResponse.body.find(
        (todo)=>todo.id === todoResponse.body.id
      ))
    .toMatchObject({
      title: 'update title',
      deadline: todoDate.toISOString(),
      done: false
    });
  });

  it('should not be able to update a non existing todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user8'
      });

    const todoDate = new Date();

    const response = await request(app)
      .put('/todos/invalid-todo-id')
      .send({
        title: 'update title',
        deadline: todoDate
      })
      .set('username', userResponse.body.username)
      .expect(404);

    expect(response.body.error).toBeTruthy();
  });

  it('should be able to mark a todo as done', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user3'
      });

    const todoDate = new Date();

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', userResponse.body.username);

    const response = await request(app)
      .patch(`/todos/${todoResponse.body.id}/done`)
      .set('username', userResponse.body.username);

    expect(response.body).toMatchObject({
      ...todoResponse.body,
      done: true
    });
  });

  it('should not be able to mark a non existing todo as done', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user4'
      });

    const response = await request(app)
      .patch('/todos/invalid-todo-id/done')
      .set('username', userResponse.body.username)
      .expect(404);

    expect(response.body.error).toBeTruthy();
  });

  it('should be able to delete a todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user5'
      });

    const todoDate = new Date();

    const todo1Response = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', userResponse.body.username);

    await request(app)
      .delete(`/todos/${todo1Response.body.id}`)
      .set('username', userResponse.body.username)
      .expect(204);

    const listResponse = await request(app)
      .get('/todos')
      .set('username', userResponse.body.username);

    expect(listResponse.body).toEqual([]);
  });

  it('should not be able to delete a non existing todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user6'
      });

    const response = await request(app)
      .delete('/todos/invalid-todo-id')
      .set('username', userResponse.body.username)
      .expect(404);

    expect(response.body.error).toBeTruthy();
  });

  it('should not be able to access todos without a username', async () => {
    const response = await request(app)
      .get('/todos')
      .expect(404);

    expect(response.body).toEqual({ error: 'User not found!' });
  });

  it('should only list todos belonging to the authenticated user', async () => {
    const firstUserResponse = await request(app)
      .post('/users')
      .send({
        name: 'First User',
        username: 'isolation-user-1'
      });

    const secondUserResponse = await request(app)
      .post('/users')
      .send({
        name: 'Second User',
        username: 'isolation-user-2'
      });

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'private todo',
        deadline: new Date()
      })
      .set('username', firstUserResponse.body.username);

    const response = await request(app)
      .get('/todos')
      .set('username', secondUserResponse.body.username);

    expect(response.body).not.toEqual(
      expect.arrayContaining([todoResponse.body])
    );
    expect(response.body).toEqual([]);
  });

  it('should not be able to update another user todo', async () => {
    const ownerResponse = await request(app)
      .post('/users')
      .send({
        name: 'Todo Owner',
        username: 'owner-user'
      });

    const otherUserResponse = await request(app)
      .post('/users')
      .send({
        name: 'Other User',
        username: 'other-user'
      });

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'owner todo',
        deadline: new Date()
      })
      .set('username', ownerResponse.body.username);

    const response = await request(app)
      .put(`/todos/${todoResponse.body.id}`)
      .send({
        title: 'updated by another user',
        deadline: new Date()
      })
      .set('username', otherUserResponse.body.username)
      .expect(404);

    expect(response.body).toEqual({ error: 'Todo not found!' });
  });
});