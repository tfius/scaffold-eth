import { BlinkingCursorTextBuilder } from "react-animated-text-builders";

// https://movcmpret.com/demo/animated-text-builders/
export default function FText(props) {
  return (
    <BlinkingCursorTextBuilder blinkTimeAfterFinish={1} blinkingSpeed={1000} timeout={30}>
       {props.children}
    </BlinkingCursorTextBuilder>
  )
}
