import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/AuthScreen';
import AnamneseScreen from '../screens/AnamneseScreen';
import TreinoScreen from '../screens/TreinoScreen';
import QRScreen from '../screens/QRScreen';
import PixScreen from '../screens/PixScreen';
import ConquistasScreen from '../screens/ConquistasScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerStyle:{ backgroundColor:'#0f172a' },
          headerTintColor:'#fff',
          headerTitleStyle:{ fontWeight:'bold' },
          contentStyle:{ backgroundColor:'#0f172a' },
          animation:'slide_from_right',
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title:'Cadastro / Login' }} />
        <Stack.Screen name="Anamnese" component={AnamneseScreen} options={{ title:'Anamnese + PAR-Q' }} />
        <Stack.Screen name="Treino" component={TreinoScreen} options={{ title:'Treino Ativo (30)' }} />
        <Stack.Screen name="QR" component={QRScreen} options={{ title:'QR Check-in a+b' }} />
        <Stack.Screen name="Pix" component={PixScreen} options={{ title:'Pagamento' }} />
        <Stack.Screen name="Conquistas" component={ConquistasScreen} options={{ title:'Conquistas' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
