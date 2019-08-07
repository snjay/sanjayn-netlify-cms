import React from 'react'
import _sortBy from 'lodash/sortBy'

import PageHeader from '../components/PageHeader'
import PostCategoriesNav from '../components/PostCategoriesNav'
import PostSection from '../components/PostSection'

import './Blog.css'

export default ({
  fields,
  blogs = [],
  postCategories = [],
  showFeatured = true
}) => {
  const { title, subtitle, featuredImage } = fields
  blogs = _sortBy(blogs, ['date']).reverse()

  return (
    <main className='Blog'>
      <PageHeader
        title={title}
        subtitle={subtitle}
        backgroundImage={featuredImage}
      />

      {!!postCategories.length && (
        <PostCategoriesNav categories={postCategories} />
      )}

      {!!blogs.length && <PostSection posts={blogs} />}
    </main>
  )
}
