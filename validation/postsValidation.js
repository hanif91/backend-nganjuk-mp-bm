import { check } from 'express-validator'

const createPostRules = [
    check('title').notEmpty().isString(),
    check('content').notEmpty().isString(),
]

export { createPostRules }