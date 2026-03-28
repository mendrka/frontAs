import Avatar from '../components/shared/Avatar'

export const CharacterAvatar = ({ character, ...props }) => {
  return <Avatar character={character} {...props} />
}

export default CharacterAvatar

