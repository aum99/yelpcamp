const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const MongoDBStore = require("connect-mongo")(session);
const dbUrl = process.env;

require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
console.log(dbUrl.DB_URL);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

mongoose.set("strictQuery", false);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected!");
});
mongoose.connect(dbUrl.DB_URL);

app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const store = new MongoDBStore({
  url: dbUrl.DB_URL,
  secret: "thisisasecretkey",
  touchAfter: 24 * 60 * 60,
  mongooseConnection: mongoose.connection,
  collection: "session",
});

store.on("error", function (e) {
  console.log("Session store error", e);
});
const sessionConfig = {
  store,
  name: "yelpid",
  secret: "thisisasecretkey",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found x_x", 400));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("Serving on port 3000");
});
