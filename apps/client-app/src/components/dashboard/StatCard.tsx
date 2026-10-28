import Icon, { type IconName } from '../common/Icon';

const TONES = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  green: 'bg-green-100 text-green-600',
} as const;

interface Props {
  label: string;
  value: number;
  tone: keyof typeof TONES;
  icon: IconName;
}

export default function StatCard({ label, value, tone, icon }: Props) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-3xl mt-2">{value}</p>
        </div>
        <div
          className={`h-12 w-12 rounded-lg flex items-center justify-center ${TONES[tone]}`}
        >
          <Icon name={icon} className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
