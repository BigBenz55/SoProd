export default defineEventHandler(event => ({ authenticated: isAdmin(event) }))
