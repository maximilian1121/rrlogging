import postgres from 'postgres'

const sql = postgres({
    password: process.env.NEXT_PRIVATE_POSTGRES_PASSWORD,
    username: process.env.NEXT_PRIVATE_POSTGRES_USER,
    database: process.env.NEXT_PRIVATE_POSTGRES_DB,
    host: process.env.NEXT_PRIVATE_POSTGRES_HOST,
})

export default sql