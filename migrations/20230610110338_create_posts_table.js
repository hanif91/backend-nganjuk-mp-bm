exports.up = function(knex) {
  return knex.schema.createTable('posts', table => {
      table.increments('id').primary()
      table.integer('user_id').unsigned()
      table.string('title', 255)
      table.text('content')

      table.foreign('user_id').references('users.id')
  })
}

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('posts')
}
