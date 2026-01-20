import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// export default defineCliConfig({
//   //…
//   deployment: {
//     appId: 'pv9iih5io0cgtxtc2kbyzwn5',
//   },
//   //…
// })

export default defineConfig({
  name: 'default',
  title: 'Nomad Fitness',

  projectId: 'zi6fc02j',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
