import React, { Component, Fragment } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Helmet from 'react-helmet'

import ScrollToTop from './components/ScrollToTop'
import Meta from './components/Meta'
import Home from './views/Home'
import About from './views/About'
import Blog from './views/Blog'
import SinglePost from './views/SinglePost'
import Contact from './views/Contact'
import NoMatch from './views/NoMatch'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ServiceWorkerNotifications from './components/ServiceWorkerNotifications'
import data from './data.json'
import { slugify } from './util/url'
import { documentHasTerm, getCollectionTerms } from './util/collection'
import Projects from "./views/Projects";

const RouteWithMeta = ({ component: Component, ...props }) => (
  <Route
    {...props}
    render={routeProps => (
      <Fragment>
        <Meta {...props} />
        <Component {...routeProps} {...props} />
      </Fragment>
    )}
  />
)

class App extends Component {
  state = {
    data
  }

  getDocument = (collection, name) =>
    this.state.data[collection] &&
    this.state.data[collection].filter(page => page.name === name)[0]

  getDocuments = collection => this.state.data[collection] || []

  render () {
    const globalSettings = this.getDocument('settings', 'global')
    const {
      siteTitle,
      siteUrl,
      siteDescription,
      socialMediaCard,
      headerScripts
    } = globalSettings

    const posts = this.getDocuments('posts').filter(
      post => post.status !== 'Draft'
    )
    const categoriesFromPosts = getCollectionTerms(posts, 'categories')
    const postCategories = this.getDocuments('postCategories').filter(
      category => categoriesFromPosts.indexOf(category.name.toLowerCase()) >= 0
    )

    return (
      <Router>
        <div className='React-Wrap'>
          <ScrollToTop />
          <ServiceWorkerNotifications reloadOnUpdate />
          <Helmet
            defaultTitle={siteTitle}
            titleTemplate={`%s | ${siteTitle}`}
          />
          <Meta
            headerScripts={headerScripts}
            absoluteImageUrl={
              socialMediaCard &&
              socialMediaCard.image &&
              siteUrl + socialMediaCard.image
            }
            twitterCreatorAccount={
              socialMediaCard && socialMediaCard.twitterCreatorAccount
            }
            twitterSiteAccount={
              socialMediaCard && socialMediaCard.twitterSiteAccount
            }
          />

          <Nav />

          <Switch>
            <RouteWithMeta
              path='/'
              exact
              component={Home}
              description={siteDescription}
              fields={this.getDocument('pages', 'home')}
            />
            <RouteWithMeta
              path='/about'
              exact
              component={About}
              fields={this.getDocument('pages', 'about')}
            />
            <RouteWithMeta
              path='/contact'
              exact
              component={Contact}
              fields={this.getDocument('pages', 'contact')}
              siteTitle={siteTitle}
            />
            <RouteWithMeta
              path='/projects'
              exact
              component={Projects}
              fields={this.getDocument('pages', 'projects')}
              posts={posts}
              postCategories={postCategories}
            />

            {posts.map((post, index) => {
              const path = slugify(`/projects/${post.title}`)
              const nextPost = posts[index - 1]
              const prevPost = posts[index + 1]
              return (
                <RouteWithMeta
                  key={path}
                  path={path}
                  exact
                  component={SinglePost}
                  fields={post}
                  nextPostURL={nextPost && slugify(`/projects/${nextPost.title}/`)}
                  prevPostURL={prevPost && slugify(`/projects/${prevPost.title}/`)}
                />
              )
            })}

            {postCategories.map(postCategory => {
              const slug = slugify(postCategory.title)
              const path = slugify(`/projects/category/${slug}`)
              const categoryPosts = posts.filter(post =>
                documentHasTerm(post, 'categories', slug)
              )
              return (
                <RouteWithMeta
                  key={path}
                  path={path}
                  exact
                  component={Blog}
                  fields={this.getDocument('pages', 'blog')}
                  posts={categoryPosts}
                  postCategories={postCategories}
                />
              )
            })}

            <Route render={() => <NoMatch siteUrl={siteUrl} />} />
          </Switch>
          <Footer />
        </div>
      </Router>
    )
  }
}

export default App
