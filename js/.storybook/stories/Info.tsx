import * as React from 'react'
import { withInfo } from "@storybook/addon-info";

export let Info = (fn: React.FunctionComponent) => withInfo({ inline: true })(() => {
    return <div style={{padding: '10px 40px'}}>{fn({})}</div>
})
