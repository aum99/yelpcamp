const User = require("../models/user");

module.exports.renderRegisterForm = (req, res) => {
  res.render("users/register");
};

module.exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ email, username });
    const userDocRef = await User.register(user, password);
    req.login(userDocRef, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to yelpcamp");
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = req.session.returnTo || "/campgrounds";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Goodbye!");
    res.redirect("/");
  });
};
