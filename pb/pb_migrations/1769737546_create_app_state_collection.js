migrate((app) => {
  let collection = new Collection({
    "type": "base",
    "name": "app_state",
    "fields": [
      {
        "type": "text",
        "name": "key",
      },
      {
        "type": "json",
        "name": "data"
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  })

  app.save(collection)
}, (app) => {
  let collection = app.findCollectionByNameOrId("app_state")
  app.delete(collection)
})
