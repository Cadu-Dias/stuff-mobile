import { createStaticNavigation } from '@react-navigation/native'
import RootStack from './stack.routes'

const Navigation = createStaticNavigation(RootStack)

export default Navigation;