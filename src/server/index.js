import express from 'express'

var app = express()

app.use(express.static(`${__dirname}/root`))
app.use('/vendor', express.static(`${__dirname}/../node_modules`))

app.listen(process.env.PORT || 3000, function () {
  console.log('Server ready at', this.address())
})
