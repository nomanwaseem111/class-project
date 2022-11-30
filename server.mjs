import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import {
    stringToHash,
    varifyHash,
} from "bcrypt-inzi"
const app = express()
app.use(express.json())
app.use(cors())
const port = process.env.PORT || 5002

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    createdOn: { type: Date, default: Date.now(), }
});


const userModel = mongoose.model('user', userSchema);


app.post('/signup', async (req, res) => {

    let body = req.body


    if (!body.firstName || !body.lastName || !body.email || !body.password) {
        res.status(401).send(`Please Fill All Required Fields`)
        return;
    }


    userModel.findOne({ email: body.email }, (err, data) => {

        if (!err) {

            console.log("Data", data);

            if (data) {
                console.log("User Already Exist");
                res.status(200).send({ message: "User Already Exist" })
                return
            } else {
                stringToHash(body.password).then(hashString => {

                    let newUser = new userModel({

                        firstName: body.firstName,
                        lastName: body.lastName,
                        email: body.email.toLowerCase(),
                        password: hashString

                    })
                    newUser.save((err, result) => {
                        if (!err) {

                            console.log("User is Created", result);
                            res.status(200).send({ message: "User is Created" })
                        } else {
                            console.log("db error", err);
                            res.status(500).send({ message: "db error" })
                            return;
                        }
                    })

                })
            }

        } else {
            console.log("db error in query");
            res.status(500).send({ message: "db error in query" })
            return
        }
    })
})


app.post('/login', async (req, res) => {

    let body = req.body


    if (!body.email || !body.password) {
        res.status(401).send(`Please Fill All Required Fields`)
        return;
    }


    userModel.findOne({ email: body.email },"firstName lastName email password",(err, data) => {

        if (!err) {

            console.log("Data", data);

            if (data) {

                varifyHash(body.password, data.password).then(isMatched => {
                    if (isMatched) {
                        console.log("User Login", data);
                        res.status(200).send({ message: "User Login" , profile:{
                            firstName:data.firstName,
                            lastName:data.lastName,
                            email:data.email,
                            
                        }})
                    } else {
                        console.log("Incorrect Email or Password");
                        res.status(401).send({ message: "Incorrect Email or Password" })

                    }
                })


            } else {


                console.log("User not Found" , err);
                res.status(404).send({ message: "User not Found" })
                return

            }

        } else {
            console.log("db error in query");
            res.status(500).send({ message: "db error in query" })
            return
        }
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

let dbURI = process.env.MONGODBURI || "mongodb+srv://abc:abc@cluster0.bql8mte.mongodb.net/newUser?retryWrites=true&w=majority";
// let dbURI = 'mongodb://localhost/mydatabase';
mongoose.connect(dbURI);


////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
    // process.exit(1);
});

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});