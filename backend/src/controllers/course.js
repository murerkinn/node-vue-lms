const fs = require('fs')
const Validator = require('async-validator').default

const Course = require('../models/course')

exports.createCourse = async (req, res, next) => {
  const descriptor = {
    title: [
      { required: true, message: 'Course title is required.\n' },
      { min: 3, message: 'Course title should have a minimum length of 3 characters.\n' },
      { max: 200, message: 'Course title should have a maximum length of 200 characters.\n' }
    ],
    description: [
      { required: true, message: 'Course description is required.\n' },
      { min: 3, message: 'Course description should have a minimum length of 3 characters.\n' }
    ]
  }

  const validator = new Validator(descriptor)


  const courseRequest = {
    title: req.body.title,
    description: req.body.description,
    // categories: req.body.categories,
    thumbnail: req.file.path.replace('/app/src', '/api')
  }

  try {
    await validator.validate({ title: req.body.title, description: req.body.description })
  } catch ({ errors }) {
    return next({ message: errors.map(e => e.message).join('') })
  }

  const course = new Course(courseRequest)

  try {
    await course.save()

    req.user.createdCourses.push(course)
    await req.user.save()

    res.send(course)
  } catch (e) {
    return next(e)
  }
}

exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()

    res.status(200).send(courses)
  } catch (e) {
    return next(e)
  }
}

exports.addChapter = async (req, res, next) => {
  const chapter = {
    title: req.body.title,
    description: req.body.description,
    createdBy: req.user._id
  }

  const course = await Course.findById(req.params.courseId)

  course.chapters.push(chapter)

  try {
    await course.save()

    res.sendStatus(201)
  } catch (e) {
    return next(e)
  }
}

exports.addLesson = async (req, res, next) => {
  const lesson = {
    title: req.body.title,
    content: req.body.content,
    resources: req.file ? req.file.path.replace('/app/src', '/api') : '',
    estimatedCompletionTime: req.body.estimatedCompletionTime,
    createdBy: req.user._id
  }

  const course = await Course.findById(req.params.courseId)
  const chapter = course.chapters.find(c => c._id == req.params.chapterId)

  chapter.lessons.push(lesson)

  try {
    await course.save()

    res.sendStatus(201)
  } catch (e) {
    return next(e)
  }
}

exports.deleteLesson = async (req, res, next) => {

  const course = await Course.findById(req.params.courseId)
  const chapter = course.chapters.find(c => c._id == req.params.chapterId)
  const lesson = chapter.lessons.find(l => l._id == req.params.lessonId)

  if (lesson.resources != '') {
    try {
      fs.unlinkSync(lesson.resources.replace('/api', '/app/src'))
    } catch(err) {
      console.log(err)
    }
  }

  chapter.lessons = chapter.lessons.filter(l => l._id != req.params.lessonId)

  try {
    await course.save()

    res.sendStatus(200)
  } catch (e) {
    return next(e)
  }
}
