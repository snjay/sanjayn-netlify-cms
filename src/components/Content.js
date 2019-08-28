import React from 'react'
import Marked from 'react-markdown'
import PropTypes from 'prop-types'
import {getImageSrc, getImageSrcset} from '../util/getImageUrl'
import './Content.css'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {prism as codeStyle} from 'react-syntax-highlighter/dist/esm/styles/prism'

const encodeMarkdownURIs = (source = '') => {
  const markdownLinkRegex = /\[(?:\[[^\]]*\]|[^[\]])*\]\([ \t]*<?((?:\([^)]*\)|[^()])*?)>?[ \t]*(['"].*?\6[ \t]*)?\)/g
  return source.replace(markdownLinkRegex, (match, linkURI) => {
    if (!linkURI) return match
    const replaced = match.replace(linkURI, encodeURI(linkURI))
    return replaced
  })
}

const ImageWithSrcset = ({nodeKey, src, alt, ...props}) => {
  const decodedSrc = decodeURI(src)
  return (
    <img
      className='Content--Image'
      {...props}
      src={getImageSrc(decodedSrc)}
      srcSet={getImageSrcset(decodedSrc)}
      alt={alt}
    />
  )
}

const HtmlBlock = ({value}) => {
  if (value.indexOf('<iframe') !== 0) return value
  return (
    <div
      className={`Content--Iframe`}
      dangerouslySetInnerHTML={{
        __html: value
      }}
    />
  )
}

const CodeBlock = ({value}) => {
  return (
    <SyntaxHighlighter language='javascript' style={codeStyle}>
      {value}
    </SyntaxHighlighter>
  )
}

const Content = ({source, src, className = ''}) => (
  <Marked
    className={`Content ${className}`}
    source={encodeMarkdownURIs(source || src)}
    renderers={{
      image: ImageWithSrcset,
      html: HtmlBlock,
      code: CodeBlock
    }}
  />
)

Content.propTypes = {
  source: PropTypes.string,
  src: PropTypes.string,
  className: PropTypes.string
}

export default Content
