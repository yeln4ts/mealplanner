migrate((app) => {
    let superusers = app.findCollectionByNameOrId("_superusers")

    let record = new Record(superusers)

    // note: the values can be eventually loaded via $os.getenv(key)
    // or from a special local config file
    record.set("email", "admin@example.com")
    record.set("password", "admin12345")

    app.save(record)
}, (app) => { // optional revert operation
    try {
        let record = app.findAuthRecordByEmail("_superusers", "admin@example.com")
        app.delete(record)
    } catch {
        // silent errors (probably already deleted)
    }
})
