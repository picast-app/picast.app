import styled from 'styled-components'

export const Container = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`

export const TabWrap = styled.div`
  position: relative;
  width: 100%;
  padding: 1rem 10vw;
  padding-bottom: 0.6rem;
`

export const TabContainer = styled.ul.attrs({ role: 'presentation' })`
  width: 100%;
  display: flex;
  justify-content: space-between;
  color: var(--cl-text-strong);

  li {
    width: 100%;
    flex-grow: 1;
    text-align: center;

    a {
      text-decoration: none;
      color: inherit;
      text-transform: capitalize;

      &:not([aria-selected='true']) {
        opacity: 0.7;
      }
    }
  }
`

export const ActiveTabLine = styled.div`
  display: block;
  position: absolute;
  width: 100px;
  --lw: 0.1rem;
  top: calc(100% - var(--lw));
  height: var(--lw);
  background-color: var(--cl-text-strong);
  transform-origin: left;
`

export const SectionWrap = styled.div.attrs({ className: 'fs-sec-wrap' })`
  width: 100%;
  display: flex;
  flex-grow: 1;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar {
    display: none;
  }
`

export const Section = styled.section`
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;

  & > article {
    height: 100%;
  }
`
