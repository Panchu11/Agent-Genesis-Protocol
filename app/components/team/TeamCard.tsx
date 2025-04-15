'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/common/Card';
import { Button } from '@/app/components/common/Button';
import { Team } from '@/app/lib/types/team';

interface TeamCardProps {
  team: Team;
  isOwner: boolean;
  memberCount?: number;
  resourceCount?: number;
  onDelete?: (teamId: string) => void;
}

export default function TeamCard({
  team,
  isOwner,
  memberCount = 0,
  resourceCount = 0,
  onDelete,
}: TeamCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200">
            {team.avatar_url ? (
              <Image
                src={team.avatar_url}
                alt={team.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-800 text-sm font-bold">
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{team.name}</CardTitle>
            <CardDescription>
              {team.is_personal ? 'Personal Team' : 'Collaborative Team'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 line-clamp-3">
          {team.description || 'No description provided.'}
        </p>
        
        <div className="mt-4 flex justify-between text-sm text-gray-500">
          <div>
            <span className="font-medium">{memberCount}</span> {memberCount === 1 ? 'member' : 'members'}
          </div>
          <div>
            <span className="font-medium">{resourceCount}</span> {resourceCount === 1 ? 'resource' : 'resources'}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex flex-col space-y-2">
        <Link href={`/teams/${team.id}`} className="w-full">
          <Button variant="default" className="w-full">
            View Team
          </Button>
        </Link>
        
        {isOwner && onDelete && (
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(team.id)}
          >
            Delete Team
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
