import { render, waitFor, act, screen, prettyDOM  } from '@testing-library/react-native';
import MapExplorerScreen from '../MapExplorerScreen';

jest.mock('@/services/GISImporterService');

describe('MapExplorerScreen Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('renders correctly', () => {
        const {getAllByText} = render(<MapExplorerScreen />);
        expect(getAllByText("Go"))
    });
});