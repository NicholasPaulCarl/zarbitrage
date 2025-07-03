import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { storage as dbStorage } from './storage';
import { type User } from '@shared/schema';

// Configure Passport.js
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Convert username to lowercase for case-insensitive comparison
      const user = await dbStorage.getUserByUsername(username.toLowerCase());
      
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user to the session
passport.serializeUser((user, done) => {
  console.log("Serializing user to session:", { 
    id: (user as User).id, 
    username: (user as User).username,
    isAdmin: !!(user as User).isAdmin
  });
  done(null, (user as User).id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user from session, ID:", id);
    const user = await dbStorage.getUser(id as number);
    if (!user) {
      console.log("User not found during deserialization, ID:", id);
      return done(null, false);
    }
    
    // Create a safe user object with isAdmin flag for auth checks
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: !!user.isAdmin, // Ensure isAdmin is a boolean
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      subscriptionActive: user.subscriptionActive,
      subscriptionExpires: user.subscriptionExpires,
      subscriptionPaymentId: user.subscriptionPaymentId
    };
    
    console.log("User successfully deserialized:", { 
      id: user.id, 
      username: user.username, 
      isAdmin: !!user.isAdmin 
    });
    done(null, safeUser);
  } catch (error) {
    console.error("Error deserializing user:", error);
    done(error);
  }
});

export default passport;