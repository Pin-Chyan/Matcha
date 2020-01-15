import React from 'react';
import { BrowserRouter as Router, Route, Switch} from "react-router-dom";
import "./App.sass";

import Register from "./components/register-component.js";
import Home from "./components/home-component.js";
import Login from "./components/login-component.js";
import User from "./components/user-component.js";
import Edit from "./components/edit-component.js";
import upload from "./components/upload.js";
import Authenticate from "./components/auth/auth-component.js";
import msg from "./components/message-and-notification.js";
import invite from "./components/invite-component.js";
import chat from "./components/chat-component.js";
import logout from "./components/auth/logout";
import Verify from  "./components/auth/verify-component.js";
import Forgot from "./components/forgot-component.js";
// import tags from "./components/tags-input.js";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/register" exact component={Register} />
        <Route path="/login" exact component={Login} />
        <Route path="/invite" exact component={invite} />
        <Route path="/chat" exact component={chat} />
        <Route path="/logout" exact component={logout} />
        <Route path="/forgot" exact component={Forgot} />
        <Route path="/verify/:vkey" component={Verify}/>
        <Authenticate>
        <Route path="/logout" exact component={logout} />
          <Route path="/" exact component={Home} />
          <Route path="/edit" exact component={Edit} />
          <Route path="/user" exact component={User} />
          <Route path="/upload" exact component={upload} />
          <Route path="/msg" exact component={msg} />
        </Authenticate>
        {/* <Route path="/tags" exact component={tags} /> */}        
      </Switch>
    </Router>
  );
}

export default App;
