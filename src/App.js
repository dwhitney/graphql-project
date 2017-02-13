import React, { Component } from 'react';
import _ from 'lodash';
import logo from './logo.svg';
import './App.css';
import { gqlQuery } from './gql';
import Comment from './Comment';

const inputStyle = {
  fontSize: 20
};

const queryUser = (userName) => gqlQuery(`{
  hn2 {
    user: nodeFromHnId(id:"${userName}", isUserId:true) {
      id
      ... on HackerNewsV2User {
        submitted {
          edges {
            node {
              id
              __typename
              ... on HackerNewsV2Comment {
                text
                parent {
                  __typename
                  id
                }
                kids {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`);

class App extends Component {
  state = {
    activeUser: 'scyclow',
    userData: {},
    loading: false
  }

  userRequests = 0;

  async setUser(userName) {
    this.setState({ loading: true })
    this.setState({ activeUser: userName })
    const requestNumber = ++this.userRequests;
    const userData = await queryUser(userName);

    if (requestNumber === this.userRequests) {
      this.setState({ loading: false, userData: userData.data.hn2 });
    }
  }

  componentDidMount() {
    this.setUser(this.state.activeUser);
  }

  renderComments(submissions) {
    if (this.state.loading) {
      return 'loading';
    }

    if (!submissions || !submissions.length) {
      return 'No submissions for this user.'
    }

    return submissions
      .map(submission => submission.node)
      .filter(submission => submission.__typename === 'HackerNewsV2Comment')
      .map((submission, i) =>
        <Comment
          key={i}
          commentId={submission.id}
          text={submission.text}
          parent={submission.parent}
          kids={submission.kids}
        />
      );
  }

  render() {
    const submissions = _.get(this, 'state.userData.user.submitted.edges');
    console.log(this.state.userData, submissions)

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </div>

        <div style={{ padding: 10 }}>
          <input
            style={inputStyle}
            value={this.state.activeUser}
            onChange={event => this.setUser(event.target.value)}
          />
        </div>

        <div>
          {this.renderComments(submissions)}
        </div>
      </div>
    );
  }
}

export default App;
