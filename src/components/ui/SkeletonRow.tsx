export default function SkeletonRow() {
  return (
    <tr className="border-b border-[#E8E3DC]">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-5 py-4">
          <div className={`animate-skeleton rounded-md h-4 ${
            i === 1 ? 'w-32' : i === 2 ? 'w-40' : i === 3 ? 'w-24' : i === 4 ? 'w-20' : i === 5 ? 'w-16' : 'w-20'
          }`} />
        </td>
      ))}
    </tr>
  )
}
