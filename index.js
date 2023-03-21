const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

// use all the middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qahuo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


function verifyJWT (req,res,next) {
    console.log("token", req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        res.status(401).send("Unauthorized Access")
    }
    const token = authHeader.split(" ")[1];
    

}

async function run () {
   try {
     const appointmentOptionCollection = client.db("milestone_12_doctor_portal_batch_6").collection("appointmentOptions");
     const bookingsCollection =  client.db("milestone_12_doctor_portal_batch_6").collection("bookings");
     const usersCollection =  client.db("milestone_12_doctor_portal_batch_6").collection("users");
     
     // get all the data from the database
     // use aggregate to query multiple collection and then merge data;
     app.get("/appointmentOptions", async(req,res) => {
        const date = req.query.date;
        const query = {};
        const options = await appointmentOptionCollection.find(query).toArray();
        const bookingQuery = {appointmentDate: date};
        const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
        options.forEach(option => {
            const optionBooked = alreadyBooked.filter(book => book.treatmentName === option.name);
            const bookedSlots = optionBooked.map(book => book.slot);
            const remainingSlots = option.slots.filter(slot => ! bookedSlots.includes(slot))
            option.slots = remainingSlots;
            // console.log(option.name,remainingSlots.length);
        })
        res.send(options)
     })

     // add a booking from the user interface
     app.post("/bookings", async(req,res) => {
        const booking = req.body;
        console.log(booking);
        const query = {
            appointmentDate: booking.appointmentDate,
            treatmentName : booking.treatmentName,
            email : booking.email,

        };

        const alreadyBooked = await bookingsCollection.find(query).toArray();
        if(alreadyBooked.length) {
            const message = `You Already Have A Booking On ${booking.appointmentDate}`;
            return res.send({acknowledged: false, message})
        }

        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
     })


     app.get("/bookings", verifyJWT, async(req,res) => {
        const email = req.query.email;
        const query = {email:email};
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
     });
     
     
     app.post("/users", async(req,res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
     });


     app.get("/jwt", async(req,res) => {
        const email = req.query.email;
        const query = {email:email};
        const user = await usersCollection.findOne(query);
        if(user) {
            const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn : "1d"});
            return res.send({accessToken : token})
        }
        res.status(403).send({accessToken : "Forbidden Access"}); 
     })


   } finally {

   }
}

run().catch(console.dir)


























app.get("/", (req, res) => {
  res.send("Hello Doctor Portal Server Side ? ");
});

app.listen(port, () => {
  console.log(`Listening to the port ${port} successfully`);
});
