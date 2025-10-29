const request = require("supertest");
const app = require("../src/index");

describe("User and Todo Management", () => {
  beforeEach(() => {
    // Reset users before each test
    global.users = [];
  });

  it("should create a user", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("John Doe");
    expect(response.body.username).toBe("johndoe");
  });

  it("should not create a user with existing username", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const response = await request(app)
      .post("/users")
      .send({ name: "Jane Doe", username: "johndoe" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "This username already exists!" });
  });

  it("should retrieve todos for an existing user", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const response = await request(app)
      .get("/todos")
      .set("username", "johndoe");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should create a todo for an existing user", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const response = await request(app)
      .post("/todos")
      .set("username", "johndoe")
      .send({ title: "New Todo", deadline: new Date() });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe("New Todo");
    expect(response.body.done).toBe(false);
  });

  it("should update a todo for an existing user", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const todoResponse = await request(app)
      .post("/todos")
      .set("username", "johndoe")
      .send({ title: "New Todo", deadline: new Date() });

    const todoId = todoResponse.body.id;

    const response = await request(app)
      .put(`/todos/${todoId}`)
      .set("username", "johndoe")
      .send({ title: "Updated Todo", deadline: new Date() });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Todo");
  });

  it("should mark a todo as done", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const todoResponse = await request(app)
      .post("/todos")
      .set("username", "johndoe")
      .send({ title: "New Todo", deadline: new Date() });

    const todoId = todoResponse.body.id;

    const response = await request(app)
      .patch(`/todos/${todoId}/done`)
      .set("username", "johndoe");

    expect(response.status).toBe(200);
    expect(response.body.done).toBe(true);
  });

  it("should delete a todo", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const todoResponse = await request(app)
      .post("/todos")
      .set("username", "johndoe")
      .send({ title: "New Todo", deadline: new Date() });

    const todoId = todoResponse.body.id;

    const response = await request(app)
      .delete(`/todos/${todoId}`)
      .set("username", "johndoe");

    expect(response.status).toBe(204);
  });

  it("should return 404 when trying to get todos for a non-existing user", async () => {
    const response = await request(app)
      .get("/todos")
      .set("username", "nonexistentuser");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "User not found!" });
  });

  it("should return 404 when trying to update a non-existing todo", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const response = await request(app)
      .put("/todos/nonexistenttodoid")
      .set("username", "johndoe")
      .send({ title: "Updated Todo", deadline: new Date() });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Todo not found!" });
  });

  it("should return 404 when trying to delete a non-existing todo", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", username: "johndoe" });

    const response = await request(app)
      .delete("/todos/nonexistenttodoid")
      .set("username", "johndoe");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Todo not found!" });
  });
});