import React, { Component } from 'react';
import _ from 'lodash';
import { gqlQuery } from './gql';


const style = {
  padding: 10,
  borderTop: '2px dotted black',
  textAlign: 'left'
};


// This sucks. Is there a more dynamic way to a nested array of edges?
const queryKids = (commentId) => gqlQuery(`{
  hn2 {
    node(id: "${commentId}") {
      ... on HackerNewsV2Comment {
        kids {
          edges {
            node {
              id
              ... on HackerNewsV2Comment {
                text
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

const queryParent = (parentId) => gqlQuery(`{
  hn2 {
    node(id: "${parentId}") {
      ... on HackerNewsV2Comment {
        text
        parent {
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
}`);

class Comment extends Component {
  state = {
    queriedKids: null,
    queriedParent: null,
    loading: {
      kids: false,
      parent: false
    }
  }

  async queryKids() {
    this.setState({ loading: { ...this.state.loading, kids: true } });

    const kids = await queryKids(this.props.commentId);
    const kidsParsed = _.get(kids, 'data.hn2.node.kids.edges').map(kid => kid.node);

    this.setState({
      queriedKids: kidsParsed,
      loading: { ...this.state.loading, kids: false }
    });
  }

  async queryParent() {
    this.setState({ loading: { ...this.state.loading, parent: true } });
    const parent = await queryParent(this.props.parent.id);
    const parentParsed = parent.data.hn2.node

    this.setState({
      queriedParent: parentParsed,
      loading: { ...this.state.loading, parent: false }
    });
  }

  renderKids(children) {
    if (children) {
      return children;
    }

    if (this.state.loading.kids) {
      return <div>loading</div>
    }

    if (!this.state.queriedKids) {
      return <a href="javascript:void(0)" onClick={() => this.queryKids()}>Show Kids</a>
    }

    return this.state.queriedKids.map((kid, i) =>
      <Comment
        key={i}
        commentId={kid.id}
        text={kid.text}
        kids={kid.kids}
        nestedLevel={(this.props.nestedLevel || 0) + 1}
      />
    );
  }

  renderWithParent() {
    const { id, text, parent } = this.state.queriedParent;

    return (
      <Comment
        commentId={id}
        text={text}
        parent={parent}
      >
        {this.renderComment(this.props.nestedLevel || 0 + 1)}
      </Comment>
    )
  }

  renderParentText() {
    if (this.state.loading.parent) {
      return <div>loading</div>
    }

    if (!this.state.queriedParent) {
      return <a href="javascript:void(0)" onClick={() => this.queryParent()}>Show Parent</a>
    }
  }

  renderComment(nestedLevel) {
    const { text, parent, kids, children } = this.props;
    const offset = (nestedLevel || 0) * 20;

    const subCommentsExist = _.get(kids, 'edges.length', false) || !!children;
    const parentExists = !!parent && parent.__typename === 'HackerNewsV2Comment';

    return (
      <div style={_.assign({marginLeft: offset }, style)}>
        {parentExists && this.renderParentText()}
        <div dangerouslySetInnerHTML={{ __html: text }} />
        {subCommentsExist && this.renderKids(children)}
      </div>
    );
  }

  render() {
    const { nestedLevel } = this.props;

    return this.state.queriedParent
      ? this.renderWithParent()
      : this.renderComment(nestedLevel);
  }
}


export default Comment;
