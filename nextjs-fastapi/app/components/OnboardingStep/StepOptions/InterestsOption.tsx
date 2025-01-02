import { Interest } from "@prisma/client";

import { InterestCategory } from '@prisma/client';
import { cn } from "@/lib/utils";

interface InterestOptionProps {
    availableInterests: Interest[];
    formData: { interests?: string[] };
    onInterestSelect: (interestId: string) => void;
    maxSelect?: number;
}

const InterestOption: React.FC<InterestOptionProps> = ({
    availableInterests,
    formData,
    onInterestSelect,
    maxSelect = 5
}) => {
    return (
        <div className="space-y-4">
            {Object.entries(availableInterests).map(([category, interests]) => (
                <div key={category} className="space-y-2">
                    <h3 className="font-medium text-primary">
                        {category.split('_').map(word =>
                            word.charAt(0) + word.slice(1).toLowerCase()
                        ).join(' ')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {(interests as unknown as Array<{ id: string; name: string; category: InterestCategory }>).map((interest) => (

                            <button
                                key={interest.id}
                                onClick={() => onInterestSelect(interest.id)}
                                className={cn(
                                    "p-2 rounded-lg text-sm transition-colors",
                                    formData.interests?.includes(interest.id)
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 hover:bg-gray-200"
                                )}
                            >
                                {interest.name.split(/(?=[A-Z])/).join(' ')}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InterestOption;