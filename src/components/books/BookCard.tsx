import React from 'react';
import Card from '../ui/Card';
import { Book } from '../../types';
import { Book as BookIcon, Calendar, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookCardProps {
  book: Book;
  index: number;
  onSelect?: (book: Book) => void;
  onDelete?: (bookId: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, index, onSelect, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card 
        hoverable={!!onSelect}
        className="p-4 h-full relative"
        onClick={() => onSelect && onSelect(book)}
      >        <div className="flex items-center mb-2">
          <div className="flex items-center flex-1">
            <BookIcon size={20} className="text-indigo-600 mr-2" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{book.title}</h3>
              {book.author && (
                <p className="text-sm text-gray-600">Yazar: {book.author}</p>
              )}
              {book.subject && (
                <p className="text-sm text-gray-500">Ders: {book.subject}</p>
              )}
            </div>
          </div>
            <div className="flex items-center space-x-2">
            {book.is_story_book && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <BookOpen size={12} className="mr-1" />
                Hikaye
              </span>
            )}
            
            {onDelete && (
              <button
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 flex items-center justify-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(book.id);
                }}
              >
                Sil
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={16} className="mr-1" />
          <span>Added: {new Date(book.created_at).toLocaleDateString()}</span>
        </div>
      </Card>
    </motion.div>
  );
};

export default BookCard;