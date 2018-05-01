import React from 'react';
import axios from 'axios';
import DeleteButton from './DeleteButton';
import { Link } from 'react-router-dom';
import {DOMAIN_URL} from '../utils/Constants';

export default class PostsList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
        };
        this.deletePost = this.deletePost.bind(this);
    }

    componentDidMount() {
        let url = `${DOMAIN_URL}/api/v1/post/logged-in-userposts/`;
        if (!!this.props.username) {
            url = `${DOMAIN_URL}/api/v1/post/userposts/${this.props.username}`;
        }
        axios.get(url)
        .then((response) => {
            const posts = response.data.data;
            this.setState({loading: false, posts: posts});
            console.log(response);
        })
        .catch((error) => {
            this.setState({loading: false, errorMessage: error.response.data.message});
            console.log(error);
        });
    }

    deletePost(index) {
        const newPosts = this.state.posts.slice(0,index).concat(this.state.posts.slice(index+1));
        this.setState({posts: newPosts});
    }

    render() {
        if (this.state.loading) {
            return (
                <div>
                    <h1>Loading</h1>
                </div>
            );
        } else if (!!this.state.posts) {
            return (
                <ul>
                    {
                        this.state.posts.map((post, index) => {
                            let deleteButton = null;
                            let editButton = null;
                            let foundButton = null;
                            if (this.props.postsEditable === true) {
                                deleteButton = <DeleteButton deletePost={this.deletePost} postId={post.id} postIndex={index}/>;
                                editButton = (
                                    <Link to={{
                                        pathname: '/post/edit',
                                        state: { post: post }
                                    }}>
                                        Edit
                                    </Link>
                                );
                                foundButton = (
                                    <Link to={{
                                        pathname: '/post/found',
                                        state: { post: post }
                                    }}>
                                        Found
                                    </Link>
                                );
                            }
                            return (
                                <li key={index}>
                                    {post.id}: looking for {post.name} around {post.formatted_address}
                                    {editButton}
                                    {deleteButton}
                                    {foundButton}
                                    <ul>
                                        {post.additional_attributes.map((attr, index) =>
                                            <li key={index}>
                                                {attr.key} => {attr.value}
                                            </li>
                                        )}
                                    </ul>
                                </li>
                            );
                        })
                    }
                </ul>
            );
        } else {
            return (
                <div>
                    <h1>{this.state.errorMessage || "Error loading content"}</h1>
                </div>
            );
        }
    }


}
