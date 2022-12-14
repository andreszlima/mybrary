const express = require('express')
const author = require('../models/author')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const uploadPath = path.join('public', Book.coverImageBasePath)
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif']
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})

// All books route
router.get('/', async (req,res) => {

    let query = Book.find()
    if(req.query.title) {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }

    if(req.query.publishedBefore) {
        query = query.lte('publishDate', req.query.publishedBefore)
    }

    if(req.query.publishedAfter) {
        query = query.gte('publishDate', req.query.publishedAfter)
    }

    try {
        const books = await query.exec()
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        })
    } catch (error) {
        
    }
})

// New book route
router.get('/new', async (req,res) => {
    renderNewPage(res, new Book())
})

// Create book route
router.post('/', upload.single('cover'), async (req, res) => {
    const fileName = req.file ? req.file.filename : null
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    })

    try {
        const newBook = await book.save()
        res.redirect('books')
    } catch (error) {
        if (book.coverImageName) {
            removeBookCover(book.coverImageName)
        }
        renderNewPage(res, book, true)
    }
})

function removeBookCover(filename) {
    fs.unlink(path.join(uploadPath, filename), err => {
        if(err) console.error(err)
    })
}

async function renderNewPage(res, book, hasError = false) {
    try {
        
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if (hasError) params.errorMessage = 'Error creating book'

        res.render('books/new', params)

    } catch (error) {
        res.redirect('/books')
    }
}

module.exports = router